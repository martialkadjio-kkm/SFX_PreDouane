import Image from "next/image";
import React from "react";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative min-h-svh">
      <Image
        src="/bg2.png"
        alt="Background"
        fill
        className="absolute inset-0 z-0 object-cover"
        priority
      />
      <div className="relative z-10 flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm md:max-w-3xl">{children}</div>
      </div>
    </div>
  );
};

export default AuthLayout;
