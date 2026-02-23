"use client";
import './styles/auth.css';
import Login from './login/page';
import { useEffect } from 'react';
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token"); 
    if (!token) {
      router.push('/login');
    }
    else {
      router.push('/dashboard');
    }
  }, []);
}
