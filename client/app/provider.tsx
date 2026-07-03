"use client";

import { UserDetailContext } from "@/context/UserDetailContext";
import { useUser } from "@clerk/nextjs";
import React, { useEffect, useState } from "react";

type UsersDetail = {
  name: string,
  email: string
}

export type { UsersDetail };

function Provider({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {

  const {user} = useUser();
  const [userDetail, setUserDetail] = useState<any>()

  useEffect(() => {
    if (user) {
      setUserDetail({
        name: user.fullName || user.firstName || "User",
        email: user.primaryEmailAddress?.emailAddress || "",
      });
    }
  },[user])

  return (
    <div>
      <UserDetailContext.Provider value={{userDetail, setUserDetail}}>
      {children}
      </UserDetailContext.Provider>
      </div>
  )
}

export default Provider