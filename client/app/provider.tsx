"use client";

import { UserDetailContext } from "@/context/UserDetailContext";
import { useUser } from "@clerk/nextjs";
import React, { useEffect, useState } from "react";
import { usePostHog } from "posthog-js/react";

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
  const posthog = usePostHog();
  const [userDetail, setUserDetail] = useState<any>()

  useEffect(() => {
    if (user) {
      const email = user.primaryEmailAddress?.emailAddress || "";
      setUserDetail({
        name: user.fullName || user.firstName || "User",
        email,
      });

      // Identify the user in PostHog
      posthog.identify(user.id, {
        email,
        name: user.fullName || user.firstName || "User",
        createdAt: user.createdAt,
      });
    }
  }, [user, posthog]);


  return (
    <div>
      <UserDetailContext.Provider value={{userDetail, setUserDetail}}>
      {children}
      </UserDetailContext.Provider>
      </div>
  )
}

export default Provider