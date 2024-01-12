"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

const UserProfile = () => {
  const auth_token = JSON.parse(localStorage.getItem("accessToken" || ""));
  const [isLoader, setLoader] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [userData, setUserData] = useState({});
  const router = useRouter();

  useEffect(() => {
    const auth_token = JSON.parse(localStorage.getItem("accessToken" || ""));

    if (auth_token) {
      verify();
    } else {
      setAuthenticated(false);
      router.push("/user/login");
    }
  }, []);

  const verify = async () => {
    setLoader(true);
    try {
      const auth_token = JSON.parse(localStorage.getItem("accessToken" || ""));
      const res = await axios.get(`/api/auth/verifyUserToken/${auth_token}`);
      if (res.status === 200) {
        setAuthenticated(true);
        setLoader(false);
        console.log("authenticate", res.data.data);
        console.log("type", typeof res.data.data);
        setUserData(res.data.data);
      } else {
        setAuthenticated(false);
        router.push("/user/login");
        setLoader(false);
      }
    } catch (error) {
      setAuthenticated(false);
      console.error("Error occurred:", error);
      router.push("/user/login");
      setLoader(false);
    }
  };

  return (
    <>
    <div className="bg-gray-100 h-screen p-4">
    <div className=" bg-white border border-gray-100 rounded-md flex justify-center text-[22px] font-bold">User Profile</div>
 <div className=" flex items-center justify-center">

  <div className="bg-white border border-gray-300 p-4 mt-4 rounded-md">
    {userData && (
      <div>
        <div className="flex mb-2">
          <p className="w-26 mr-2">First Name:</p>
          <div>{userData.firstname}</div>
        </div>
        <div className="flex mb-2">
          <p className="w-26 mr-2">Last Name:</p>
          <div>{userData.lastname}</div>
        </div>
        <div className="flex mb-2">
          <p className="w-26 mr-2">Email:</p>
          <div>{userData.email}</div>
        </div>
        <div className="flex mb-2">
          <p className="w-26 mr-2">Mobile No.:</p>
          <div>{userData.mobile}</div>
        </div>
      </div>
    )}
  </div>
</div>
</div>

    </>
  );
};

export default UserProfile;
