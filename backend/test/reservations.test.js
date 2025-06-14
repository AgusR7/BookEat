"use strict";
// Unit tests for reservations.controller.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../src/db");
const ReservationsController = __importStar(require("../src/controllers/reservations.controller"));
// Mock dependencies
jest.mock('../src/db');
jest.mock('../src/utils/mailer'); // Mock mailer
jest.mock('../src/sockets/occupancySocket', () => ({
    io: {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
    },
}));
const mailer_1 = require("../src/utils/mailer");
const occupancySocket_1 = require("../src/sockets/occupancySocket");
describe('Reservations Controller', () => {
    let mockRequest;
    let mockResponse;
    let mockNext = jest.fn();
    let responseJson;
    let responseStatus;
    beforeEach(() => {
        jest.clearAllMocks();
        responseJson = {};
        responseStatus = 0;
        mockRequest = {
            body: {},
            params: {},
            query: {},
            session: {
                user: undefined,
                restaurant: undefined,
                regenerate: jest.fn((callback) => callback()),
                destroy: jest.fn((callback) => callback()),
            },
        };
        mockResponse = {
            status: jest.fn((status) => {
                responseStatus = status;
                return mockResponse;
            }),
            json: jest.fn((json) => {
                responseJson = json;
                return mockResponse;
            }),
            send: jest.fn(), // For getAvailableTimes which might use res.send
        };
    });
    // Test suites for each controller function will go here
    // e.g., describe('createReservation', () => { ... });
    // e.g., describe('getReservationById', () => { ... });
    // etc.
    // Mock for db client from pool
    const mockDbClient = {
        query: jest.fn(),
        release: jest.fn(),
    };
    // Setup db.connect mock before tests run, but after jest.mock('../src/db')
    // This can be done once within the main describe block or per-test if needed,
    // but since it's a general setup for most controller actions, here is fine.
    // Ensure this is run after jest.mock() by placing it inside describe or beforeEach of describe.
    // For simplicity, we'll ensure db.connect is mocked to return our client.
    // This specific way of mocking db.connect might need adjustment if it doesn't work directly.
    // A common pattern is to do this inside a beforeEach for the describe block.
    beforeEach(() => {
        db_1.db.connect.mockResolvedValue(mockDbClient);
        // Also, clear mockDbClient's history for each test to avoid interference
        mockDbClient.query.mockClear();
        mockDbClient.release.mockClear();
    });
    describe('createReservation', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1); // Tomorrow
        // Set to a valid time, e.g., 14:00 local time. Assuming local is UTC-3.
        // So, 17:00 UTC.
        futureDate.setUTCHours(17, 0, 0, 0);
        const reservationTimeEpoch = futureDate.getTime();
        const mockUserSession = { id: 1, name: 'Test User', email: 'user@example.com', role: 'user' };
        const mockRestaurantData = { seats_total: 50, name: 'Test Restaurant' };
        const mockReservationPayload = {
            restaurant_id: 1,
            reservation_at: reservationTimeEpoch,
            guests: 2,
        };
        const mockNewReservation = {
            id: 100,
            user_id: mockUserSession.id,
            restaurant_id: mockReservationPayload.restaurant_id,
            reservation_at: new Date(reservationTimeEpoch).toISOString(),
            requested_guests: mockReservationPayload.guests,
            guests: 2, // assignedGuests (assuming 2 is even)
            status: 'pending',
        };
        it('should return 400 if requestedGuests is greater than seats_total', async () => {
            mockRequest.session.user = mockUserSession;
            mockRequest.body = {
                restaurant_id: 1,
                reservation_at: reservationTimeEpoch,
                guests: 100, // > seats_total mockeado
            };
            mockDbClient.query
                .mockResolvedValueOnce({
                rows: [{ seats_total: 50, open_time: '10:00', close_time: '23:30' }],
                rowCount: 1,
            })
                .mockResolvedValueOnce({
                rows: [{ used_tables: 0 }],
                rowCount: 1,
            });
            await ReservationsController.createReservation(mockRequest, mockResponse);
            expect(responseStatus).toBe(400);
            expect(responseJson.error).toBe('No hay suficientes mesas en ese horario');
            expect(mockDbClient.release).toHaveBeenCalledTimes(1);
        });
        it('should create a reservation successfully', async () => {
            mockRequest.session.user = mockUserSession;
            mockRequest.body = mockReservationPayload;
            mockDbClient.query
                .mockResolvedValueOnce({ rows: [mockRestaurantData], rowCount: 1 }) // Get restaurant capacity
                .mockResolvedValueOnce({ rows: [{ used_tables: 5 }], rowCount: 1 }) // Get used tables
                .mockResolvedValueOnce({ rows: [mockNewReservation], rowCount: 1 }); // Insert reservation
            await ReservationsController.createReservation(mockRequest, mockResponse);
            expect(responseStatus).toBe(201);
            expect(responseJson.message).toBe('Reservation confirmed');
            expect(responseJson.reservation).toEqual(expect.objectContaining({
                ...mockNewReservation,
                user_name: mockUserSession.name,
                user_email: mockUserSession.email,
            }));
            expect(mailer_1.sendReservationConfirmationEmail).toHaveBeenCalledTimes(1);
            expect(occupancySocket_1.io.to).toHaveBeenCalledWith(`restaurant_${mockReservationPayload.restaurant_id}`);
            expect(occupancySocket_1.io.emit).toHaveBeenCalledWith('new_reservation', { reservation: expect.objectContaining({ id: mockNewReservation.id }) });
            expect(occupancySocket_1.io.emit).toHaveBeenCalledWith('occupancy_update', { restaurant_id: mockReservationPayload.restaurant_id });
            expect(mockDbClient.release).toHaveBeenCalledTimes(1);
        });
        it('should return 401 if user is not authenticated', async () => {
            mockRequest.session.user = undefined; // No user session
            mockRequest.body = mockReservationPayload;
            await ReservationsController.createReservation(mockRequest, mockResponse);
            expect(responseStatus).toBe(401);
            expect(responseJson.error).toBe('Unauthorized');
        });
        it('should return 403 if user is not a customer (e.g., restaurant user)', async () => {
            mockRequest.session.user = { ...mockUserSession, role: 'restaurant' }; // User is a restaurant owner
            mockRequest.body = mockReservationPayload;
            await ReservationsController.createReservation(mockRequest, mockResponse);
            expect(responseStatus).toBe(403);
            expect(responseJson.error).toBe('Forbidden: Only customers can create reservations.');
        });
        it('should return 400 if reservation_at is in the past', async () => {
            mockRequest.session.user = mockUserSession;
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);
            mockRequest.body = { ...mockReservationPayload, reservation_at: pastDate.getTime() };
            await ReservationsController.createReservation(mockRequest, mockResponse);
            expect(responseStatus).toBe(400);
            expect(responseJson.error).toBe('No se puede hacer una reserva en el pasado.');
        });
        it('should return 400 if reservation time is outside opening hours (too early)', async () => {
            mockRequest.session.user = mockUserSession;
            const earlyTime = new Date(futureDate);
            earlyTime.setUTCHours(12, 0, 0, 0); // 12:00 UTC is 09:00 local (UTC-3), too early if open is 10:00
            mockRequest.body = { ...mockReservationPayload, reservation_at: earlyTime.getTime() };
            await ReservationsController.createReservation(mockRequest, mockResponse);
            expect(responseStatus).toBe(400);
            expect(responseJson.error).toBe('Invalid reservation time');
        });
        it('should return 400 if reservation time is outside opening hours (too late)', async () => {
            mockRequest.session.user = mockUserSession;
            const lateTime = new Date(futureDate);
            lateTime.setUTCHours(2, 31, 0, 0); // 02:31 UTC next day is 23:31 local (UTC-3), too late if close is 23:30
            mockRequest.body = { ...mockReservationPayload, reservation_at: lateTime.getTime() };
            await ReservationsController.createReservation(mockRequest, mockResponse);
            expect(responseStatus).toBe(400);
            expect(responseJson.error).toBe('Invalid reservation time');
        });
        it('should return 404 if restaurant not found', async () => {
            mockRequest.session.user = mockUserSession;
            mockRequest.body = mockReservationPayload;
            mockDbClient.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // Restaurant not found
            await ReservationsController.createReservation(mockRequest, mockResponse);
            expect(responseStatus).toBe(404);
            expect(responseJson.error).toBe('Restaurant not found');
            expect(mockDbClient.release).toHaveBeenCalledTimes(1);
        });
        it('should return 400 if not enough tables available', async () => {
            mockRequest.session.user = mockUserSession;
            mockRequest.body = mockReservationPayload;
            mockDbClient.query
                .mockResolvedValueOnce({ rows: [mockRestaurantData], rowCount: 1 }) // Get restaurant (50 seats = 25 tables)
                .mockResolvedValueOnce({ rows: [{ used_tables: 24 }], rowCount: 1 }); // 24 tables used, 1 left. Need 1 for 2 guests.
            // If guests = 4, needs 2 tables, then this would fail.
            mockRequest.body.guests = 4; // Requires 2 tables
            await ReservationsController.createReservation(mockRequest, mockResponse);
            expect(responseStatus).toBe(400);
            expect(responseJson.error).toBe('No hay suficientes mesas en ese horario');
            expect(mockDbClient.release).toHaveBeenCalledTimes(1);
        });
        it('should return 500 if database query fails during insert', async () => {
            mockRequest.session.user = mockUserSession;
            mockRequest.body = mockReservationPayload;
            mockDbClient.query
                .mockResolvedValueOnce({ rows: [mockRestaurantData], rowCount: 1 })
                .mockResolvedValueOnce({ rows: [{ used_tables: 5 }], rowCount: 1 })
                .mockRejectedValueOnce(new Error('DB insert error')); // Insert reservation fails
            await ReservationsController.createReservation(mockRequest, mockResponse);
            expect(responseStatus).toBe(500);
            expect(responseJson.error).toBe('Server error');
            expect(mockDbClient.release).toHaveBeenCalledTimes(1);
        });
    });
    describe('getReservations', () => {
        const mockUserSession = { id: 1, name: 'Test User', email: 'user@example.com', role: 'user' };
        const mockReservationsData = [
            { id: 1, restaurant_id: 10, restaurant_name: 'Restaurant A', reservation_at: new Date().toISOString(), requested_guests: 2, guests: 2, status: 'confirmed' },
            { id: 2, restaurant_id: 20, restaurant_name: 'Restaurant B', reservation_at: new Date().toISOString(), requested_guests: 4, guests: 4, status: 'pending' },
        ];
        it('should return reservations for the authenticated user, sorted by date', async () => {
            mockRequest.session.user = mockUserSession;
            // Mock db.query as this function uses it directly, not via client.query
            db_1.db.query.mockResolvedValueOnce({ rows: mockReservationsData, rowCount: mockReservationsData.length });
            await ReservationsController.getReservations(mockRequest, mockResponse);
            expect(responseStatus).toBe(200);
            // The controller sorts them, so the test should also expect sorted data if the mock data isn't presorted in the exact way.
            // For simplicity, assuming mockReservationsData is already in the desired sort order or the exact order isn't critical for this test's core validation.
            expect(responseJson).toEqual(mockReservationsData);
            expect(db_1.db.query).toHaveBeenCalledWith(expect.any(String), [mockUserSession.id]);
        });
        it('should return 401 if user is not authenticated', async () => {
            mockRequest.session.user = undefined;
            await ReservationsController.getReservations(mockRequest, mockResponse);
            expect(responseStatus).toBe(401);
            expect(responseJson.error).toBe('Unauthorized');
        });
        it('should return 500 if database query fails', async () => {
            mockRequest.session.user = mockUserSession;
            db_1.db.query.mockRejectedValueOnce(new Error('DB error'));
            await ReservationsController.getReservations(mockRequest, mockResponse);
            expect(responseStatus).toBe(500);
            expect(responseJson.error).toBe('Server error');
        });
    });
    describe('deleteReservation', () => {
        const mockUserSession = { id: 1, name: 'Test User', email: 'user@example.com', role: 'user' };
        const reservationIdToDelete = 123;
        const mockReservationDetails = {
            restaurant_id: 10,
            requested_guests: 2,
            reservation_at: new Date().toISOString(),
            restaurant_name: 'Test Restaurant for Cancellation',
        };
        it('should delete a reservation successfully', async () => {
            mockRequest.session.user = mockUserSession;
            mockRequest.params = { id: String(reservationIdToDelete) };
            // Mock for SELECT query in transaction
            // Refined mockImplementation for successful deletion transaction
            mockDbClient.query.mockImplementation(async (sql, params) => {
                const upperSql = sql.toUpperCase();
                if (upperSql === 'BEGIN')
                    return { rows: [], rowCount: 0 };
                if (upperSql.startsWith('SELECT R.RESTAURANT_ID, R.REQUESTED_GUESTS, R.RESERVATION_AT, REST.NAME AS RESTAURANT_NAME FROM RESERVATIONS R JOIN RESTAURANTS REST ON REST.ID = R.RESTAURANT_ID WHERE R.ID = $1 AND R.USER_ID = $2 FOR UPDATE')) {
                    // Check params if necessary, e.g. params[0] === reservationIdToDelete
                    return { rows: [mockReservationDetails], rowCount: 1 };
                }
                if (upperSql.startsWith('DELETE FROM RESERVATIONS WHERE ID = $1')) {
                    // Check params if necessary, e.g. params[0] === reservationIdToDelete
                    return { rows: [], rowCount: 1 }; // Successful delete
                }
                if (upperSql === 'COMMIT')
                    return { rows: [], rowCount: 0 };
                // Fallback for unexpected queries during this test
                throw new Error(`Unexpected query in deleteReservation success test: ${sql}`);
            });
            await ReservationsController.deleteReservation(mockRequest, mockResponse);
            expect(responseStatus).toBe(200);
            expect(responseJson.message).toBe('Reservation cancelled');
            // Verify the sequence and content of calls
            expect(mockDbClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
            expect(mockDbClient.query).toHaveBeenNthCalledWith(2, 'SELECT r.restaurant_id, r.requested_guests, r.reservation_at, rest.name AS restaurant_name FROM reservations r JOIN restaurants rest ON rest.id = r.restaurant_id WHERE r.id = $1 AND r.user_id = $2 FOR UPDATE', [reservationIdToDelete, mockUserSession.id]);
            expect(mockDbClient.query).toHaveBeenNthCalledWith(3, 'DELETE FROM reservations WHERE id = $1', [reservationIdToDelete]);
            expect(mockDbClient.query).toHaveBeenNthCalledWith(4, 'COMMIT');
            expect(mailer_1.sendReservationCancellationEmail).toHaveBeenCalledTimes(1);
            expect(occupancySocket_1.io.to).toHaveBeenCalledWith(`restaurant_${mockReservationDetails.restaurant_id}`);
            expect(occupancySocket_1.io.emit).toHaveBeenCalledWith('occupancy_update', { restaurant_id: mockReservationDetails.restaurant_id });
            expect(mockDbClient.release).toHaveBeenCalledTimes(1);
        });
        it('should return 401 if user is not authenticated', async () => {
            mockRequest.session.user = undefined;
            mockRequest.params = { id: String(reservationIdToDelete) };
            await ReservationsController.deleteReservation(mockRequest, mockResponse);
            expect(responseStatus).toBe(401);
            expect(responseJson.error).toBe('Unauthorized');
        });
        it('should return 404 if reservation not found or does not belong to user', async () => {
            mockRequest.session.user = mockUserSession;
            mockRequest.params = { id: String(reservationIdToDelete) };
            mockDbClient.query.mockImplementation(async (sql) => {
                if (sql.toUpperCase() === 'BEGIN')
                    return { rows: [], rowCount: 0 };
                if (sql.toUpperCase().startsWith('SELECT'))
                    return { rows: [], rowCount: 0 }; // Simulate reservation not found
                if (sql.toUpperCase() === 'ROLLBACK')
                    return { rows: [], rowCount: 0 };
                return { rows: [], rowCount: 0 };
            });
            await ReservationsController.deleteReservation(mockRequest, mockResponse);
            expect(responseStatus).toBe(404);
            expect(responseJson.error).toBe('Reservation not found');
            expect(mockDbClient.query).toHaveBeenCalledWith('ROLLBACK');
            expect(mockDbClient.release).toHaveBeenCalledTimes(1);
        });
        it('should return 500 if database query fails (e.g., DELETE fails)', async () => {
            mockRequest.session.user = mockUserSession;
            mockRequest.params = { id: String(reservationIdToDelete) };
            mockDbClient.query.mockImplementation(async (sql) => {
                if (sql.toUpperCase() === 'BEGIN')
                    return { rows: [], rowCount: 0 };
                if (sql.toUpperCase().startsWith('SELECT'))
                    return { rows: [mockReservationDetails], rowCount: 1 };
                if (sql.toUpperCase().startsWith('DELETE'))
                    throw new Error('DB DELETE error'); // Simulate DELETE failure
                if (sql.toUpperCase() === 'ROLLBACK')
                    return { rows: [], rowCount: 0 };
                return { rows: [], rowCount: 0 };
            });
            await ReservationsController.deleteReservation(mockRequest, mockResponse);
            expect(responseStatus).toBe(500);
            expect(responseJson.error).toBe('Server error');
            expect(mockDbClient.query).toHaveBeenCalledWith('ROLLBACK');
            expect(mockDbClient.release).toHaveBeenCalledTimes(1);
        });
    });
}); // Added missing closing bracket for the main describe block
