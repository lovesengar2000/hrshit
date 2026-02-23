import React from 'react'
import style from './forgot.module.css'
const page = () => {
  return (
      <div className={style.LoginWrapper}>
      <div className={style.LoginModal}>
        <div className={style.FormBlock}>
          <input
            id="EmailField"
            placeholder="Email"
            type="text"
            className={style.Input}
          />

          <input
            id="PasswordField"
            placeholder="Password"
            type="password"
            className={style.Input}
          />

          <div className={style.CaptchaRow}>
            <div className={style.CaptchaText}>C3N5F</div>
            <button className={style.RefreshBtn}>↻</button>
            <input
              placeholder="Captcha"
              type="text"
              className={style.CaptchaInput}
            />
          </div>

          <button className={style.LoginBtn}>Login</button>

          <div className={style.ForgotPassword}>Forgot password ?</div>
        </div>
      </div>
    </div>
  )
}

export default page