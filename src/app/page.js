import Image from "next/image";
import SignUpRoute from "./(auth)/Signup/page";
import AuthLayout from "./(auth)/Signup/layout";

export default function Home() {
  return (
    <AuthLayout>
      <SignUpRoute/>
    </AuthLayout>
    
  );
}
