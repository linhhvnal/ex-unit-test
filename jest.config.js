module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	testMatch: ["<rootDir>/tests/**/*.test.ts"], // Match test files
	moduleFileExtensions: ["ts", "js"], // Recognize .ts and .js files
	collectCoverage: true, // Enable coverage collection
	collectCoverageFrom: ["<rootDir>/**/*.ts", "!<rootDir>/tests/**"],
	coverageDirectory: "./coverage", // Output directory for coverage reports
	coveragePathIgnorePatterns: ["/node_modules/"],
	testTimeout: 50000, // Increase test timeout to 50 seconds
	detectOpenHandles: true,
	forceExit: true,
};
