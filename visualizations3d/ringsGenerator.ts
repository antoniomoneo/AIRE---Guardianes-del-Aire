import * as THREE from 'three';
import type { DashboardDataPoint, Visualization3DGenerator, Visualization3DOptions } from '../types';

const MESH_NAME = 'data_model_group';

export const ringsGenerator: Visualization3DGenerator = (scene, data, options) => {
    const group = new THREE.Group();
    group.name = MESH_NAME;
    
    const values = data.map(d => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const isDataFlat = minVal === maxVal;

    data.forEach((point, index) => {
        const normalizedValue = isDataFlat ? 0.5 : (point.value - minVal) / (maxVal - minVal);
        const radius = 5 + normalizedValue * 50;
        const tubeRadius = 0.5;

        const geometry = new THREE.TorusGeometry(radius, tubeRadius, 8, 50);
        const color = new THREE.Color();
        
        if (options.colorScheme === 'pollutant') {
            color.setHSL(0.5 - (normalizedValue * 0.5), 0.8, 0.5); // Cyan to Red
        } else {
            color.setHSL(0.55 + (normalizedValue * 0.2), 0.6, 0.6); // Blue to Purple
        }
        
        const material = new THREE.MeshStandardMaterial({ color, metalness: 0.2, roughness: 0.6 });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.y = (index - data.length / 2) * 0.4 * options.heightMultiplier;
        mesh.rotation.x = Math.PI / 2;

        group.add(mesh);
    });

    scene.add(group);
    
    return () => { // Cleanup function
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
