import client from 'prom-client';

export const metricsRegistry = new client.Registry();

client.collectDefaultMetrics({ register: metricsRegistry });

export const newReservationsCounter = new client.Counter({
  name: 'new_reservations_total',
  help: 'Total number of new reservations created',
  labelNames: ['restaurant_id', 'restaurant_name'],
  registers: [metricsRegistry]
});
