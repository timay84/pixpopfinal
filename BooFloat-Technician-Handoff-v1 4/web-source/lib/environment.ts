'use client';
import {useEffect, useRef, useState} from 'react';

export type Environment = 'light' | 'dark';
const storageKey='boo-float-environment';

export function useEnvironment() {
  const [environment,setValue]=useState<Environment>('light');
  const environmentRef=useRef<Environment>(environment);
  environmentRef.current=environment;
  useEffect(()=>{
    try {const saved=localStorage.getItem(storageKey);if(saved==='light'||saved==='dark')setValue(saved);}catch {}
  },[]);
  const setEnvironment=(value:Environment)=>{
    setValue(value);
    try {localStorage.setItem(storageKey,value);}catch {}
  };
  return {environment,environmentRef,setEnvironment};
}
