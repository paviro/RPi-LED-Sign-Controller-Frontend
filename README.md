# RPi LED Sign Controller Frontend

This is the frontend web interface for the [RPi LED Sign Controller](https://github.com/paviro/rpi-led-sign-controller) project. It provides a user-friendly web UI for controlling LED matrix displays connected to a Raspberry Pi.

## Development

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Building for Production

To build the frontend for production use:

```bash
npm run build
# or
yarn build
# or
pnpm build
```

The built files will be in the `out` folder. These files need to be copied to the `static` folder of the Rust backend source code to be embedded into the binary and served by the backend.