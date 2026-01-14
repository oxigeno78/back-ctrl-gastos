import { Schema, model } from "mongoose";
import { themesInterfaces } from "../interfaces";

const themeSchema = new Schema< themesInterfaces.AppTheme >({
    userId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    meta: Object,
    mode: String,
    palette: Object,
    typography: Object,
    layout: Object,
    components: Object
}, {
    timestamps: true
});

export const Theme = model< themesInterfaces.AppTheme >('Theme', themeSchema);