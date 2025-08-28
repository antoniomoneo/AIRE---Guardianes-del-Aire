import * as THREE from 'three';
import type { DashboardDataPoint, Visualization3DGenerator, Visualization3DOptions } from '../types';

const MESH_NAME = 'data_model_group';

export const spikesGenerator: Visualization3DGenerator = (scene, data, options) => {
    const group = new THREE.Group();
    group.name = MESH_NAME;
    
    const years = Array.from(new Set(data.map(d => d.date.substring(0, 4))));
    if (years.length === 0) return () => {};

    const numYears = years.length;
    const numMonths = 12;
    const gridSpacing = 4;

    const values = data.map(d => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const isDataFlat = minVal === maxVal;

    const geometry = new THREE.BoxGeometry(gridSpacing * 0.6, 1, gridSpacing * 0.6);
    
    for (let i = 0; i < numYears; i++) {
        for (let j = 0; j < numMonths; j++) {
            const year = years[i];
            const month = String(j + 1).padStart(2, '0');
            const dataPoint = data.find(d => d.date === `${year}-${month}`);

            if (dataPoint) {
                const normalizedValue = isDataFlat ? 0.5 : (dataPoint.value - minVal) / (maxVal - minVal);
                const height = 0.2 + normalizedValue * 30 * options.heightMultiplier;

                const color = new THREE.Color();
                 if (options.colorScheme === 'pollutant') {
                    color.setHSL(0.5 - (normalizedValue * 0.5), 0.8, 0.5); // Cyan to Red
                } else {
                    color.setHSL(0.1 + (normalizedValue * 0.1), 0.4, 0.4); // Brown to yellow
                }
                const material = new THREE.MeshStandardMaterial({ color, metalness: 0.1, roughness: 0.8 });

                const mesh = new THREE.Mesh(geometry, material);
                mesh.scale.y = height;
                mesh.position.set(
                    (j - (numMonths - 1) / 2) * gridSpacing,
                    height / 2,
                    (i - (numYears - 1) / 2) * gridSpacing
                );
                group.add(mesh);
            }
        }
    }

    scene.add(group);
    
    return () => {
        const existingGroup = scene.getObjectByName(MESH_NAME);
        if (existingGroup) {
            existingGroup.traverse((object) => {
                if (object instanceof THREE.Mesh) {
                    // All meshes share the same geometry, dispose it only once
                    if (object.geometry) object.geometry.dispose();

                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
            // Dispose the shared geometry after traversing
            geometry.dispose();
            scene.remove(existingGroup);
        }
    };
};
