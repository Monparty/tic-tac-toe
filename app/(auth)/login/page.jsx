"use client";
import { useRouter } from "next/navigation";
import InputText from "@/app/components/inputs/InputText";
import { useForm } from "react-hook-form";
import { login } from "@/app/service/auth.service";

function Page() {
    const router = useRouter();
    const { control, handleSubmit } = useForm();

    const handleLogin = async (values) => {
        const { error } = await login(values.email, values.password);
        if (error) return alert(error?.message);
        router.push("/game");
        router.refresh();
    };

    return (
        <div className="w-full h-dvh flex items-center justify-center">
            <div className="h-100 w-70 border flex items-center justify-center">
                <form className="flex flex-col gap-6 items-center" onSubmit={handleSubmit(handleLogin)}>
                    <h1>เข้าสู่ระบบ</h1>
                    <InputText control={control} type="email" name="email" placeholder="email" />
                    <InputText control={control} type="password" name="password" placeholder="รหัสผ่าน" />
                    <div className="grid gap-2">
                        <button type="submit">เข้าสู่ระบบ</button>
                        <div className="text-sm text-gray-500 cursor-pointer text-center" onClick={() => router.push("/register")}>
                            สร้าง user
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Page;
