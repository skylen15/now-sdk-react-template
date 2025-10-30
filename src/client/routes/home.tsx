import { Button } from "primereact/button";
import React from "react";
import { useLoaderData } from "react-router";

declare global {
    interface Window {
        g_ck: string;
    }
}

export async function loadIncidents() {
    const response = await fetch("/api/now/table/incident?sysparm_fields=number,state", {
        headers: {
            "content-type": "application/json",
            "x-usertoken": window.g_ck
        }
    })

    const data = await response.json() as {
        result: {
            number: string,
            state: string
        }[]
    };

    return data;
}

export function Home() {
    return <>
        <Button label="Click" />
    </>
}
