// https://codelabs.developers.google.com/your-first-webgpu-app#2

const canvas = document.querySelector("canvas");

if (!navigator.gpu) {
    throw new Error("WebGPU not supported on this browser.");
}

const adapter = await navigator.gpu.requestAdapter();
if (!adapter) {
    throw new Error("No appropriate GPUAdapter found.");
}

const device = await adapter.requestDevice();

const context = canvas.getContext("webgpu");
const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
context.configure({device: device, format: canvasFormat});


const encoder = device.createCommandEncoder();
const pass = encoder.beginRenderPass({
colorAttachments: [{
    view: context.getCurrentTexture().createView(),
    loadOp: "clear",
    clearValue: { r: 0, g: 0.3, b: 0.4, a: 1 },
    storeOp: "store",
}]
});
pass.end();
const commandBuffer = encoder.finish();
device.queue.submit([commandBuffer]);


const vertices = new Float32Array([
    //   X,    Y,
        -0.8, -0.8, // Triangle 1 (Blue)
         0.8, -0.8,
         0.8,  0.8,

        -0.8, -0.8, // Triangle 2 (Red)
         0.8,  0.8,
        -0.8,  0.8,
]);

const vertexBuffer = device.createBuffer({
    label: "Cell vertices",
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

device.queue.writeBuffer(vertexBuffer, /*bufferOffset=*/0, vertices);

const vertexBufferLayout = {
        arrayStride: 8,
        attributes: [{
            format: "float32x2",
            offset: 0,
            shaderLocation: 0, // Position, see vertex shader
        }],
    };

const cellShaderModule = device.createShaderModule({
  label: "Cell shader",
  code: `
            @vertex
            fn vertexMain(return vec4f(0, 0, 0, 1);) -> @builtin(position) vec4f {
                return vec4f(0, 0, 0, 1);
            }

        `
});


