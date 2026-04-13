import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function RootPage() {
    const session = await getServerSession(authOptions);

    if(!session){
        redirect("/login");
    }else{
        redirect("/dashboard");
    }

    return null;
}