import * as THREE from 'three';
import type { DashboardDataPoint, Visualization3DGenerator, Visualization3DOptions } from '../types';

const MESH_NAME = 'data_model_group';

export const terrainGenerator: Visualization3DGenerator = (scene, data, options) => {
    const group = new THREE.Group();
    group.name = MESH_NAME;

    const years = Array.from(new Set(data.map(d => d.date.substring(0, 4))));
    if (years.length < 2) { // Need at least 2 years for a plane segment in depth
        return () => {};
    }

    const numYears = years.length;
    const numMonths = 12;

    const geometry = new THREE.PlaneGeometry(100, (numYears / numMonths) * 100, numMonths - 1, numYears - 1);
    const vertices = geometry.attributes.position;
    
    const values = data.map(d => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const isDataFlat = minVal === maxVal;

    const dataGrid: (number | null)[][] = Array(numYears).fill(0).map(() => Array(numMonths).fill(null));
    data.forEach(d => {
        const yearIndex = years.indexOf(d.date.substring(0, 4));
        const monthIndex = parseInt(d.date.substring(5, 7)) - 1;
        if (yearIndex !== -1) {
            dataGrid[yearIndex][monthIndex] = d.value;
        }
    });

    for (let y = 0; y < numYears; y++) {
        for (let x = 0; x < numMonths; x++) {
            const index = y * numMonths + x;
            const value = dataGrid[y][x];

            if (value !== null) {
                const normalizedValue = isDataFlat ? 0.5 : (value - minVal) / (maxVal - minVal);
                vertices.setZ(index, normalizedValue * 20 * options.heightMultiplier);
            } else {
                vertices.setZ(index, 0);
            }
        }
    }
    
    geometry.computeVertexNormals();

    const colors = [];
    for (let i = 0; i < vertices.count; i++) {
        const z = vertices.getZ(i);
        const normalizedZ = isDataFlat ? 0.5 : z / (20 * options.heightMultiplier);
        const color = new THREE.Color();
        
        if (options.colorScheme === 'pollutant') {
             color.setHSL(0.5 - (normalizedZ * 0.5), 0.8, 0.5); // Cyan to Red
        } else {
             const h = 0.35 - normalizedZ * 0.2; // Green to yellow to brown
             const s = 0.6 - normalizedZ * 0.2;
             const l = 0.4 + normalizedZ * 0.3;
             color.setHSL(h, s, l);
        }
        colors.push(color.r, color.g, color.b);
    }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, metalness: 0, roughness: 1 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2.5;
    
    group.add(mesh);
    scene.add(group);

    return () => {
        const existingGroup = scene.getObjectByName(MESH_NAME);
        if (existingGroup) {
            existingGroup.traverse((object) => {
                if (object instanceof THREE.Mesh) {
                    object.geometry.dispose();
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
            scene.remove(existingGroup);
        }
    };
};
