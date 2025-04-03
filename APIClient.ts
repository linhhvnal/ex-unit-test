import { APIResponse } from "./APIResponse";

export interface APIClient {
    callAPI(orderId: number): Promise<APIResponse>;
}