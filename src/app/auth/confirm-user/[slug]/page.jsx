"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

const page = ({ params }) => {
  const token = params?.slug || "";
  useEffect(() => {
     axios.get(`/api/auth/confirm/${token}`).then((res)=>{
        console.log(res);
     }).catch((err)=>{
        console.log(err);
     })
  }, [])
  
  return <div></div>;
};

export default page;
