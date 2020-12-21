import React, { useRef, useState, useMemo } from "react";

import { Canvas, useFrame } from "react-three-fiber";
import { frag, vert } from "./shaders";
import * as THREE from "three";
import matcap from "./images/matcap.png";
import "./App.css";

function Plane(props) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const pointer = useMemo(() => {
        return new THREE.Vector2();
    });

    const uniforms = useMemo(
        () => ({
            u_time: { value: 0.0 },
            u_resolution: { value: { x: width, y: height } },
            u_matcap: { value: new THREE.TextureLoader().load(matcap) },
            u_mouse: { value: new THREE.Vector2() },
        }),
        []
    );

    useFrame((state, delta) => {
        uniforms.u_time.value += delta;
    });

    const pointerMove = (e) => {
        pointer.set(e.x / window.innerWidth, 1 - e.y / window.innerHeight);
        pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
        uniforms.u_mouse.value.x = pointer.x;
        uniforms.u_mouse.value.y = pointer.y;

        // console.log(uniforms.u_mouse.value.x, uniforms.u_mouse.value.y);
    };

    return (
        <mesh onPointerMove={pointerMove}>
            <planeBufferGeometry args={[width - 100, height, 1, 1]} />
            <shaderMaterial
                uniforms={uniforms}
                vertexShader={vert}
                fragmentShader={frag}
            />
        </mesh>
    );
}

function App() {
    return (
        <Canvas className="canvas">
            <Plane />
        </Canvas>
    );
}

export default App;
