"use client";
import { useRouter } from "next/navigation";
import InputText from "@/app/components/inputs/InputText";
import { useForm } from "react-hook-form";
import { register } from "@/app/service/auth.service";

function Page() {
    const router = useRouter();
    const { control, handleSubmit } = useForm();

    const handleRegister = async (values) => {
        const { error } = await register(values);
        if (error) {
            alert(error?.message);
        }
        alert("สร้าง user สำเร็จ");
        router.push("/game");
    };

    return (
        <div className="w-full h-dvh flex items-center justify-center">
            <div className="h-100 w-70 border flex items-center justify-center">
                <form className="flex flex-col gap-6 items-center" onSubmit={handleSubmit(handleRegister)}>
                    <h1>สร้าง user ใหม่</h1>
                    <InputText control={control} name="username" placeholder="ชื่อผู้เล่น" />
                    <InputText control={control} type="email" name="email" placeholder="email" />
                    <InputText control={control} type="password" name="password" placeholder="รหัสผ่าน" />
                    <div className="grid gap-2">
                        <button type="submit">สร้าง user</button>
                        <div
                            className="text-sm text-gray-500 cursor-pointer text-center"
                            onClick={() => router.push("/login")}
                        >
                            ไปหน้า เข้าสู่ระบบ
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Page;
