'use client';
import {useEffect} from 'react';
import {shell} from './shell';
export default function Home(){useEffect(()=>{const script=document.createElement('script');script.type='module';script.src='/app.mjs';document.body.appendChild(script);return()=>{script.remove();};},[]);return <div dangerouslySetInnerHTML={{__html:shell}}/>;}
