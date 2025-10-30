import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router/dom";

import { router } from "./router";

import "./styles/theme.css";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 10,
        },
    },
})

const root = document.getElementById("root");

ReactDOM.createRoot(root!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
        </QueryClientProvider>
    </React.StrictMode>
);
