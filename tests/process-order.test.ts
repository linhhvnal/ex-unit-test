import { Order } from "../Order";
import { APIResponse } from "../APIResponse";
import { APIException } from "../APIException";
import { DatabaseException } from "../DatabaseException";
import { OrderProcessingService } from "../OrderProcessingService";
import { DatabaseService } from "../DatabaseService";
import { APIClient } from "../APIClient";
import * as fs from "fs";

jest.mock("fs", () => ({
	createWriteStream: jest.fn(() => ({
		write: jest.fn(),
		end: jest.fn(),
	})),
}));

describe("OrderProcessingService", () => {
	let dbService: jest.Mocked<DatabaseService>;
	let apiClient: jest.Mocked<APIClient>;
	let orderService: OrderProcessingService;
	beforeEach(() => {
		dbService = {
			getOrdersByUser: jest.fn(),
			updateOrderStatus: jest.fn(),
		} as any;
		apiClient = {
			callAPI: jest.fn(),
		} as any;
		orderService = new OrderProcessingService(dbService, apiClient);
	});

	// Handle Type A Orders with CSV Export
	describe("Handle Type A Orders", () => {
		it("should process type A orders and write to a CSV file", async () => {
			const mockOrder = new Order(1, "A", 200, true);
			dbService.getOrdersByUser.mockResolvedValue([mockOrder]);
			dbService.updateOrderStatus.mockResolvedValue(true);
			const fileWriteSpy = jest.spyOn(fs, "createWriteStream");
			const result = await orderService.processOrders(1);
			expect(result).toEqual([
				expect.objectContaining({ status: "exported", priority: "low" }),
			]);
			expect(dbService.updateOrderStatus).toHaveBeenCalledWith(
				1,
				"exported",
				"low"
			);
			expect(fileWriteSpy).toHaveBeenCalled();
		});
		it("should handle export failure for type A orders", async () => {
			const mockOrder = new Order(1, "A", 200, true);
			dbService.getOrdersByUser.mockResolvedValue([mockOrder]);
			dbService.updateOrderStatus.mockResolvedValue(true);
			const fileWriteSpy = jest.spyOn(fs, "createWriteStream");
			fileWriteSpy.mockImplementationOnce(() => {
				throw new Error("File write error");
			});
			const result = await orderService.processOrders(1);
			expect(result).toEqual([
				expect.objectContaining({ status: "export_failed" }),
			]);
			expect(dbService.updateOrderStatus).toHaveBeenCalledWith(
				1,
				"export_failed",
				"low"
			);
		});
	});

	// Handle Type B Orders with API Calls
	describe("Handle Type B Orders with API Calls", () => {
		it("should handle API with processed status", async () => {
			const mockOrder = new Order(2, "B", 80, false);
			dbService.getOrdersByUser.mockResolvedValue([mockOrder]);
			dbService.updateOrderStatus.mockResolvedValue(true);
			apiClient.callAPI.mockResolvedValue(
				new APIResponse("success", new Order(2, "B", 50, false))
			);
			const result = await orderService.processOrders(1);
			expect(result).toEqual([
				expect.objectContaining({ status: "processed", priority: "low" }),
			]);
			expect(dbService.updateOrderStatus).toHaveBeenCalledWith(
				2,
				"processed",
				"low"
			);
		});
		it("should handle API with pending status and flag is false", async () => {
			const mockOrder = new Order(2, "B", 250, false);
			dbService.getOrdersByUser.mockResolvedValue([mockOrder]);
			dbService.updateOrderStatus.mockResolvedValue(true);
			apiClient.callAPI.mockResolvedValue(
				new APIResponse("success", new Order(2, "B", 40, false))
			);
			const result = await orderService.processOrders(1);
			expect(result).toEqual([
				expect.objectContaining({ status: "pending", priority: "high" }),
			]);
			expect(dbService.updateOrderStatus).toHaveBeenCalledWith(
				2,
				"pending",
				"high"
			);
		});
		it("should handle API with pending status and flag is false", async () => {
			const mockOrder = new Order(2, "B", 180, false);
			dbService.getOrdersByUser.mockResolvedValue([mockOrder]);
			dbService.updateOrderStatus.mockResolvedValue(true);
			apiClient.callAPI.mockResolvedValue(
				new APIResponse("success", new Order(2, "B", 40, false))
			);
			const result = await orderService.processOrders(1);
			expect(result).toEqual([
				expect.objectContaining({ status: "pending", priority: "low" }),
			]);
			expect(dbService.updateOrderStatus).toHaveBeenCalledWith(
				2,
				"pending",
				"low"
			);
		});
		it("should handle API failure with error status", async () => {
			const mockOrder = new Order(2, "B", 180, false);
			dbService.getOrdersByUser.mockResolvedValue([mockOrder]);
			dbService.updateOrderStatus.mockResolvedValue(true);
			apiClient.callAPI.mockResolvedValue(
				new APIResponse("success", new Order(2, "B", 69, false))
			);
			const result = await orderService.processOrders(1);
			expect(result).toEqual([
				expect.objectContaining({ status: "error", priority: "low" }),
			]);
			expect(dbService.updateOrderStatus).toHaveBeenCalledWith(
				2,
				"error",
				"low"
			);
		});
		it("should handle API failure with status api_error", async () => {
			const mockOrder = new Order(2, "B", 80, false);
			dbService.getOrdersByUser.mockResolvedValue([mockOrder]);
			dbService.updateOrderStatus.mockResolvedValue(true);
			apiClient.callAPI.mockResolvedValue(
				new APIResponse("error", new Order(2, "B", 60, false))
			);
			const result = await orderService.processOrders(1);
			expect(result).toEqual([
				expect.objectContaining({ status: "api_error", priority: "low" }),
			]);
			expect(dbService.updateOrderStatus).toHaveBeenCalledWith(
				2,
				"api_error",
				"low"
			);
		});
		it("should handle API failure with APIException", async () => {
			const mockOrder = new Order(3, "B", 80, false);
			dbService.getOrdersByUser.mockResolvedValue([mockOrder]);
			dbService.updateOrderStatus.mockResolvedValue(true);
			apiClient.callAPI.mockRejectedValue(new APIException("API Error"));
			const result = await orderService.processOrders(1);
			expect(result).toEqual([
				expect.objectContaining({ status: "api_failure" }),
			]);
			expect(dbService.updateOrderStatus).toHaveBeenCalledWith(
				3,
				"api_failure",
				"low"
			);
		});
	});

	// Handle Type C Orders
	describe("Handle Type C Orders", () => {
		it("should process type C orders correctly", async () => {
			const mockOrder = new Order(4, "C", 50, true);
			dbService.getOrdersByUser.mockResolvedValue([mockOrder]);
			dbService.updateOrderStatus.mockResolvedValue(true);
			const result = await orderService.processOrders(1);
			expect(result).toEqual([
				expect.objectContaining({ status: "completed" }),
			]);
			expect(dbService.updateOrderStatus).toHaveBeenCalledWith(
				4,
				"completed",
				"low"
			);
		});
		it("should process type C orders with flag set to false", async () => {
			const mockOrder = new Order(4, "C", 50, false);
			dbService.getOrdersByUser.mockResolvedValue([mockOrder]);
			dbService.updateOrderStatus.mockResolvedValue(true);
			const result = await orderService.processOrders(1);
			expect(result).toEqual([
				expect.objectContaining({ status: "in_progress" }),
			]);
			expect(dbService.updateOrderStatus).toHaveBeenCalledWith(
				4,
				"in_progress",
				"low"
			);
		});
	});

	// Handle Unknown Order Types
	describe("Handle Unknown Order Types", () => {
		it("should handle unknown order types", async () => {
			const mockOrder = new Order(5, "X", 50, false);
			dbService.getOrdersByUser.mockResolvedValue([mockOrder]);
			dbService.updateOrderStatus.mockResolvedValue(true);
			const result = await orderService.processOrders(1);
			expect(result).toEqual([
				expect.objectContaining({ status: "unknown_type" }),
			]);
			expect(dbService.updateOrderStatus).toHaveBeenCalledWith(
				5,
				"unknown_type",
				"low"
			);
		});
	});

	// Handle Database Errors
	describe("Handle Database Errors", () => {
		it("should handle database errors when updating order status", async () => {
			const mockOrder = new Order(6, "A", 150, false);
			dbService.getOrdersByUser.mockResolvedValue([mockOrder]);
			dbService.updateOrderStatus.mockRejectedValue(
				new DatabaseException("DB Error")
			);
			const result = await orderService.processOrders(1);
			expect(result).toEqual([expect.objectContaining({ status: "db_error" })]);
		});
	});

	it("should handle database errors when fetching orders", async () => {
		const mockOrder = new Order(7, "A", 150, false);
		dbService.getOrdersByUser.mockRejectedValue(
			new DatabaseException("DB Error")
		);
		const result = await orderService.processOrders(1);
		expect(result).toBe(false);
	});

	// Handle Process Orders Main Function Errors
	describe("Handle Process Orders Main Function Errors", () => {
		it("should return false when getOrdersByUser throws an exception", async () => {
			dbService.getOrdersByUser.mockRejectedValue(new Error("Database Error"));
			const result = await orderService.processOrders(1);
			expect(result).toBe(false);
		});
	});
});
