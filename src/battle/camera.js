import * as THREE from 'three';
import { yaw, pitch, firstPerson, global_hitOffset } from './entities/Player.js';

export function createCamera() {
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
  return camera;
}

export function updateCamera(camera, player) {
  const cameraDistance = 6;

  if (firstPerson) {
    camera.position.copy(player.position);
    camera.position.add(global_hitOffset);

    camera.rotation.set(pitch, yaw, 0, 'YXZ');

  } else {
    const offset = new THREE.Vector3(
      - Math.cos(pitch)* Math.sin(yaw) * cameraDistance,
      - Math.sin(pitch) * cameraDistance,
      - Math.cos(pitch)* Math.cos(yaw) * cameraDistance
    );

    camera.position.copy(player.position.clone().add(global_hitOffset)).add(offset);
    camera.rotation.set(pitch * 0.5, yaw * 0.9, 0, 'YXZ');
  }

  camera.lookAt(player.position.clone().add(new THREE.Vector3(
    Math.cos(pitch)* Math.sin(yaw) * 50,
    Math.sin(pitch) * 50,
    Math.cos(pitch)* Math.cos(yaw) * 50
  )).add(global_hitOffset));
}