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
    if (IsExsistingUser === null) {
      return;
    }

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
    SaveCredentials(data);
 
    console.log(data);
    router.push("/dashboard");
  };

  const SaveCredentials = (result) => {
    localStorage.setItem("token", result.token);
    localStorage.setItem("user", JSON.stringify(result.user));

    // Extract and store employee ID if available
    if (result.Employee && result.Employee.employeeId) {
      console.log(
        "Employee ID found in login response:",
        result.Employee.employeeId,
      );
      localStorage.setItem(
        "currentEmployeeId",
        result.Employee.employeeId,
      );
      localStorage.setItem(
        "employeeData",
        JSON.stringify(result.Employee),
      );
    } else if (result.employeeId) {
      // Alternative: check if employeeId is at root level
      console.log("Employee ID at root level:", result.employeeId);
      localStorage.setItem("currentEmployeeId", result.employeeId);
    }

    // Determine and store role based on response
    let userRole = "EMPLOYEE"; // Default role

    // Check if response has roles field (for admin)
    if (result.roles) {
      userRole = result.roles;
    }
    // Check role from token
    else if (result.user?.role) {
      userRole = result.user.role;
    }
   
    localStorage.setItem("userRole", userRole);

    // Store company ID
    if (result.user?.companyId) {
      localStorage.setItem("companyId", result.user.companyId);
    }

    console.log("Login successful, stored data:", {
      token: result.token.substring(0, 20) + "...",
      userId: result.user?.userId,
      employeeId: localStorage.getItem("currentEmployeeId"),
      role: userRole,
      companyId: localStorage.getItem("companyId"),
    });
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
