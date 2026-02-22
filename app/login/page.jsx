"use client";
import React from "react";
import style from "./login.module.css";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const page = () => {
  const router = useRouter();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const [IsExsistingUser, setIsExsistingUser] = useState(null);

  const FocusChanged = async (e) => {
    const email = e.target.value;
    const isValid = emailRegex.test(email);
    if (isValid) {
      const res = await fetch("/api/auth/checkEmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email }),
      });

      const data = await res.json();
      console.log(data);
      if (data.Event && data.Event === "Invalid user") {
        setIsExsistingUser(null);
      } else if (data.exists) {
        if (data.Event && data.Event === "Employee Registration Required") {
          setIsExsistingUser(false);
          return;
        }
        setIsExsistingUser(true);
      }
      // Call API to check if user exists
      // Set to true if user exists, false otherwise
    }
  };

  const OnForgotPasswordClicked = () => {
    router.push("/forgotPassword");
  };

  const OnLoginButtonClick = async () => {
    const email = document.getElementById("EmailField").value;
    const password = document.getElementById("PasswordField").value;

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email, password: password }),
    });

    const data = await res.json();
    console.log(data);
  };
  return (
    <div className={style.LoginWrapper}>
      <div className={style.LoginModal}>
        <div className={style.FormBlock}>
          <input
            id="EmailField"
            placeholder="Email"
            type="text"
            className={style.Input}
            onBlur={(e) => FocusChanged(e)}
          />
          {IsExsistingUser !== null && (
            <input
              id="PasswordField"
              placeholder="Password"
              type="password"
              className={style.Input}
            />
          )}
          {IsExsistingUser !== null && IsExsistingUser === false && (
            <input
              id="OtpField"
              placeholder="OTP"
              type="text"
              className={style.Input}
            />
          )}

          <button
            className={style.LoginBtn}
            onClick={() => OnLoginButtonClick()}
          >
            Login
          </button>

          <div
            onClick={() => OnForgotPasswordClicked()}
            className={style.ForgotPassword}
          >
            Forgot password ?
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;
