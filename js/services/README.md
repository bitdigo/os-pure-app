# Services

Put browser API and external integration wrappers here when they grow beyond one file.

Examples:

- `printerService.js`
- `paymentService.js`
- `qrService.js`

Rules:

- Services do not render HTML.
- Services do not bind DOM events.
- Services return data or promises.
- Store actions call services, then update state.
