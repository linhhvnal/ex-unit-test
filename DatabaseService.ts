import { Order } from "./Order";

export interface DatabaseService {
    getOrdersByUser(userId: number): Promise<Order[]>;
    updateOrderStatus(orderId: number, status: string, priority: string): Promise<boolean>;
}