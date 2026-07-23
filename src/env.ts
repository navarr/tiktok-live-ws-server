import {validateEnv, z} from "pushenv";

export const env = validateEnv({
    schema: z.object({
        WS_SERVER_PORT: z.coerce.number().int().positive(),
        EULER_API_KEY: z.string().optional(),
        SESSION_ID: z.string().optional(),
        TT_IDC: z.string().optional(),
        WHITELIST_AUTHENTICATED_SESSION_ID_HOST: z.string().optional(),
    })
});

