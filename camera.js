import {
  vec3,
  mat4,
} from 'https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.js';

export class Camera {
  target = vec3.create(0, 0, 0);
  distance = 3;
  scrollDirection = 0;
  wheelTimeout = null;
  lastX = 0;
  lastY = 0;
  isDragging = false;
  pitch = 0;
  yaw = 0;
  perspective = null;

  constructor(pitch, yaw, aspect) {
    this.pitch = pitch;
    this.yaw = yaw;
    let fov = 75 * Math.PI / 180
    let near = 0.1;
    let far = 10;
    this.perspective = mat4.perspective(fov, aspect, near, far);

    //console.log("Cthis.perspective:", this.perspective);

    document.addEventListener("mousedown", this.handleMouseDown);
    document.addEventListener("mousemove", this.handleMouseMove);
    document.addEventListener("mouseup", this.handleMouseUp);
    //     document.addEventListener("wheel", this.handleMouseWheel);
   }

   getViewProjectionMatrix() {
        // https://github.com/greggman/wgpu-matrix?tab=readme-ov-file
        // https://wgpu-matrix.org/docs/functions/mat4.multiply.html

        //console.log("pitch:", this.pitch, "yaw:", this.yaw, this.pitch);

        // Model matrix
        let m = mat4.create();            // m = new mat4
        mat4.identity(m);                   // m = identity
        mat4.rotateZ(m, 0.5 * (-this.yaw / 180) * Math.PI, m);
        
        mat4.rotateX(m, 0.5 *(this.pitch / 180) * Math.PI, m);

        mat4.translate(m, [0, 0, this.distance], m);   

        mat4.invert(m, m);
        mat4.multiply(this.perspective, m, m);   // first argument on the left..

        return m;
   }

    handleMouseDown = (event) => {
        console.log("Mouse down event:", event);
        this.isDragging = true;
        this.lastX = event.clientX;
        this.lastY = event.clientY;
  };

    handleMouseMove = (event) => {
        if (!this.isDragging) return;

        const dx = event.clientX - this.lastX;
        const dy = event.clientY - this.lastY;

        this.lastX = event.clientX;
        this.lastY = event.clientY;

        // console.log("pitch:", this.pitch, "yaw:", this.yaw, this.pitch);
        
        this.pitch -= dy * 1;
        this.yaw += dx * 1;

    };

  handleMouseUp = (event) => {
    this.isDragging = false;
  };
}