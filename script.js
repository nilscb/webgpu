// https://codelabs.developers.google.com/your-first-webgpu-app#2
// https://webgpufundamentals.org/
// camera stuff: https://tchayen.com/webgpu-obj-loading-and-perspective-camera

import { Camera } from "./camera.js";

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

const aspect = canvas.clientWidth / canvas.clientHeight;
const camera = new Camera(0, 0, aspect);

const uniformBuffer = device.createBuffer({
    size: 4 * 16,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });


const vertices = new Float32Array([
    //   X,    Y, Z,
        -0.8, -0.8, 0.0, // Triangle 1
        0.8, -0.8, 0.0,
        0.8,  0.8, 0.0,

        -0.8, -0.8, 0.0, // Triangle 2
        0.8,  0.8, 0.0,
        -0.8,  0.8, 0.0,
]);

const vertexBuffer = device.createBuffer({
    label: "Cell vertices",
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

device.queue.writeBuffer(vertexBuffer, /*bufferOffset=*/0, vertices);


const vertexBufferLayout = {
        arrayStride: 12,  // antall bytes for hver vertex (3 float32 = 12 bytes)
        attributes: [{
            format: "float32x3", // XXX må gjøres om til 32x3 for 3d..
            offset: 0,
            shaderLocation: 0, // Position, see vertex shader
        }],
    };


const vertShaderCode = `
            @group(0) @binding(0) var<uniform> mvp: mat4x4f;

            @vertex
            fn vertexMain(@location(0) pos: vec3f) -> @builtin(position) vec4f { // location(0) refererer her til pos i vertexBufferLayout som jeg la til og ga verdien 0

              let nypos : vec4f = mvp * vec4f(pos, 1);
              return nypos;
              //return vec4f(pos, 1);

              //let wweev: mat4x4f  = mvp;

              //return vec4f(mvp[0][0], mvp[1][0], mvp[2][0], 1);
            }
        `;

const fragShaderCode = `
            @group(0) @binding(0) var<uniform> mvp: mat4x4f;

            @fragment
            fn fragmentMain() -> @location(0) vec4f { // location(0) refererer her til colorattachemnt 0 (siden det kun er en attacmhent)
              let a: f32 = mvp[0][0];  // uniformen nå brukes ellers blir den discarded!?
              let b: f32 = mvp[0][1];
              let c: f32 = mvp[0][2];
              return vec4f(1, 0, 0, 1);
            }
        `;
const vertModule = device.createShaderModule({ code: vertShaderCode });
const fragModule = device.createShaderModule({ code: fragShaderCode });

const pipeline = device.createRenderPipeline({
  label: "My pipeline",
  layout: "auto",
  vertex: {
    module: vertModule,
    entryPoint: "vertexMain",
    buffers: [vertexBufferLayout]
  },
  fragment: {
    module: fragModule,
    entryPoint: "fragmentMain",
    targets: [{
      format: canvasFormat
    }]
  }
});


let i = 1;

function render() {

    const uniformValues = new Float32Array(16);
    //uniformValues[0] = 0.3; //(i % 2) ? 0.9 : 0.1;
    // uniformValues.set([1,0,0,0, 
    //                    0, 1,0,0, 
    //                    0,0,1,0, 
    //                    0,0,0,1]);

    let mvp = camera.getViewProjectionMatrix();
    //console.log("mvp:", mvp);
    uniformValues.set(mvp, 0);

    device.queue.writeBuffer(uniformBuffer, 0, uniformValues);

    i++;
    //console.log("Frame:", i);


    const encoder = device.createCommandEncoder();

    const pass = encoder.beginRenderPass({
    colorAttachments: [{
        view: context.getCurrentTexture().createView(),
        loadOp: "clear",
        clearValue: { r: 0, g: 0.3, b: 0.4, a: 1 },
        storeOp: "store",
    }]
    });

    const bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0), //bindGroupLayout, //pipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
    });

    pass.setPipeline(pipeline);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.setBindGroup(0, bindGroup);
    pass.draw(vertices.length / 3); // 6 vertices
    pass.end();

    const commandBuffer = encoder.finish();

    device.queue.submit([commandBuffer]);

    requestAnimationFrame(render);
}

render();






// KLIPPINGSOMRÅDE ------------------------------
//console.log("XXX", pipeline.getBindGroupLayout(0))

// const bindGroupLayout = device.createBindGroupLayout({
//   entries: [
//     {
//       binding: 0, // The index of this binding in the shader
//       visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, // GPUShaderStage.COMPUTE | GPUShaderStage.VERTEX, // Which shader stages can access this resource
//       buffer: {
//         type: 'uniform', // The type of buffer (uniform, storage, read-only-storage)
//         minBindingSize: 0, // Minimum size of the buffer, in bytes
//       },
//     }
//   ],
// });