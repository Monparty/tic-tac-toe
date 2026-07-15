import React from "react";
import { Controller } from "react-hook-form";

function InputText({ control, name, type = "text", placeholder }) {
    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => <input {...field} type={type} placeholder={placeholder} required />}
        />
    );
}

export default InputText;
