import { Types } from "mongoose";

type ThemeMode = 'light' | 'dark';

export interface AppTheme {
    _id?: string;
    userId: Types.ObjectId;
    meta: {
        name: string;
        description?: string;
        isDefault?: boolean;
        createdAt?: Date;
        updatedAt?: Date;
    };

    mode: ThemeMode;

    palette: {
        primary: string;
        secondary?: string;
        success?: string;
        warning?: string;
        error?: string;
        info?: string;

        background: {
            app: string;
            container: string;
            elevated: string;
        };

        text: {
            primary: string;
            secondary: string;
            disabled: string;
        };

        border: {
            color: string;
            radius: number;
        };
    };

    typography: {
        fontFamily: string;
        fontSizeBase: number;
        lineHeight: number;
        headingWeight: number;
        bodyWeight: number;
    };

    layout: {
        headerHeight: number;
        sidebarWidth: number;
        contentPadding: number;
    };

    components?: {
        button?: {
            borderRadius?: number;
        };
        card?: {
            borderRadius?: number;
        };
    };
}