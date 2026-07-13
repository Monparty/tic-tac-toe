"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import InputText from "@/app/components/inputs/InputText";
import { useForm } from "react-hook-form";
import { login, register } from "@/app/service/auth.service";

function Page() {
    const router = useRouter();
    const { control, getValues } = useForm();
    const [isRegis, setIsRegis] = useState(false);

    const handleRegister = async () => {
        const values = getValues();
        const { error } = await register(values);
        alert(error?.message);
    };

    const handleLogin = async () => {
        const values = getValues();
        const { error } = await login(values.email, values.password);
        if (error) return alert(error?.message);
        router.push("/");
        router.refresh();
    };

    return (
        <div className="w-full h-dvh flex items-center justify-center">
            <div className="h-80 w-80 border flex items-center justify-center">
                <div className="flex flex-col gap-6 items-center">
                    <h1>{isRegis ? "สร้าง user ใหม่" : "เข้าสู่ระบบ"} </h1>
                    {isRegis && <InputText control={control} name="username" placeholder="ชื่อผู้เล่น" />}
                    <InputText control={control} type="email" name="email" placeholder="email" />
                    <InputText control={control} type="password" name="password" placeholder="รหัสผ่าน" />
                    {isRegis ? (
                        <div className="flex gap-2">
                            <button type="button" onClick={handleRegister}>
                                สร้าง user
                            </button>
                            <button type="button" onClick={() => setIsRegis(!isRegis)}>
                                ไปหน้า เข้าสู่ระบบ
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <button type="button" onClick={handleLogin}>
                                เข้าสู่ระบบ
                            </button>
                            <button type="button" onClick={() => setIsRegis(!isRegis)}>
                                สร้าง user
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Page;
