"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three-stdlib";
import DraggableCircle from "@/components/DraggableCircle";
import Modal from "@/components/Modal";

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ----------- モーダル用React State -----------
  const [showModal, setShowModal] = useState(false);

  // =============================================
  //  デスクトップ/スマホ共通でドラッグを扱うための参照・状態
  // =============================================
  // ドラッグ中かどうか
  const isDraggingRef = useRef(false);
  // ドラッグ開始座標（マウスダウン/タッチ開始したときの座標）
  const dragStartRef = useRef({ x: 0, y: 0 });

  // =============================================
  //  Three.js初期化はマウント時に一度だけ実行
  // =============================================
  useEffect(() => {
    // ---------- シーン, カメラ, レンダラー ----------
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0a0a0);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 2, 5);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current!,
      antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // ---------- ライト ----------
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 10, 10);
    scene.add(dirLight);

    // ---------- モデル読み込み (Blender出力) ----------
    const loader = new GLTFLoader();
    const columnColliders: { mesh: THREE.Object3D; box: THREE.Box3 }[] = [];

    loader.load("/models/dummy_model.glb", (gltf) => {
      scene.add(gltf.scene);
      gltf.scene.traverse((child) => {
        if (child.name.includes("Column") && child instanceof THREE.Mesh) {
          const colBox = new THREE.Box3().setFromObject(child);
          columnColliders.push({ mesh: child, box: colBox });
        }
      });
    });

    // ---------- プレイヤー ----------
    const playerSize = 1;
    const playerGeometry = new THREE.BoxGeometry(
      playerSize,
      playerSize,
      playerSize
    );
    const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff88 });
    const player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.set(0, playerSize / 2 + 1, 25); // 床よりちょっと上
    scene.add(player);

    // ---------- 移動や回転に使うフラグ ----------
    let moveForward = false;
    let moveBackward = false;
    let rotateLeft = false;
    let rotateRight = false;
    const moveSpeed = 0.2;
    const rotateSpeed = 0.03;

    // ---------- キーボード操作 (WASD) ----------
    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case "KeyW":
          moveForward = true;
          break;
        case "KeyS":
          moveBackward = true;
          break;
        case "KeyA":
          rotateLeft = true;
          break;
        case "KeyD":
          rotateRight = true;
          break;
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case "KeyW":
          moveForward = false;
          break;
        case "KeyS":
          moveBackward = false;
          break;
        case "KeyA":
          rotateLeft = false;
          break;
        case "KeyD":
          rotateRight = false;
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // =============================================
    //   ポインターイベント (マウス/タッチ共通)
    // =============================================
    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      e.preventDefault();
      if (!isDraggingRef.current) return;

      // ドラッグ開始からの移動差分
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      // 左右回転
      if (dx > 0) {
        rotateLeft = true;
        rotateRight = false;
      } else if (dx < 0) {
        rotateRight = true;
        rotateLeft = false;
      } else {
        // 左右に動いていない場合は回転なし
        rotateLeft = false;
        rotateRight = false;
      }

      // 前後移動
      if (dy > 0) {
        moveForward = true;
        moveBackward = false;
      } else if (dy < 0) {
        moveBackward = true;
        moveForward = false;
      } else {
        // 前後に動いていない場合は移動なし
        moveForward = false;
        moveBackward = false;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      e.preventDefault();
      isDraggingRef.current = false;
      // ドラッグ終了したので移動/回転フラグはリセット
      moveForward = false;
      moveBackward = false;
      rotateLeft = false;
      rotateRight = false;
    };

    // ドキュメント全体にリスナーを登録
    document.addEventListener("pointerdown", onPointerDown, { passive: false });
    document.addEventListener("pointermove", onPointerMove, { passive: false });
    document.addEventListener("pointerup", onPointerUp, { passive: false });

    // ---------- アニメーションループ ----------
    const playerBox = new THREE.Box3();
    const cameraOffset = new THREE.Vector3(0, 2, 5);

    const animate = () => {
      requestAnimationFrame(animate);

      // 回転
      if (rotateLeft) {
        player.rotation.y += rotateSpeed;
      }
      if (rotateRight) {
        player.rotation.y -= rotateSpeed;
      }

      // 前後
      if (moveForward) {
        const forwardDir = new THREE.Vector3(0, 0, -1);
        forwardDir.applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          player.rotation.y
        );
        player.position.addScaledVector(forwardDir, moveSpeed);
      }
      if (moveBackward) {
        const backwardDir = new THREE.Vector3(0, 0, 1);
        backwardDir.applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          player.rotation.y
        );
        player.position.addScaledVector(backwardDir, moveSpeed);
      }

      // 床より下に行かない
      if (player.position.y < playerSize / 2) {
        player.position.y = playerSize / 2;
      }

      // 円柱との衝突判定
      playerBox.setFromObject(player);
      let isIntersect = false;
      for (const col of columnColliders) {
        if (!(col.mesh instanceof THREE.Mesh)) continue;
        const mesh = col.mesh as THREE.Mesh;
        if (!mesh.geometry.boundingBox) {
          mesh.geometry.computeBoundingBox();
        }
        const bbox = mesh.geometry.boundingBox!.clone();
        bbox.applyMatrix4(mesh.matrixWorld);

        if (playerBox.intersectsBox(bbox)) {
          setShowModal(true);
          isIntersect = true;
          break;
        }
      }

      if (!isIntersect) {
        setShowModal(false);
      }

      // カメラ追従
      const offsetRotated = cameraOffset.clone();
      offsetRotated.applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        player.rotation.y
      );
      camera.position.set(
        player.position.x + offsetRotated.x,
        player.position.y + offsetRotated.y,
        player.position.z + offsetRotated.z
      );
      camera.lookAt(player.position);

      renderer.render(scene, camera);
    };
    animate();

    // ---------- クリーンアップ ----------
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      renderer.dispose();
    };
  }, []); // ← ★依存配列は空★ (マウント時のみ実行)

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{ display: "block", touchAction: "none" }}
      />
      <div
        style={{
          opacity: showModal ? 1 : 0,
          transition: "opacity 300ms ease",
          pointerEvents: showModal ? "auto" : "none",
        }}
      >
        <Modal
          onClick={() => {
            setShowModal(false);
          }}
        />
      </div>
      <div
        style={{
          height: "100vh",
          width: "100vw",
          position: "fixed",
          top: 0,
          left: 0,
          pointerEvents: "none",
        }}
      >
        <DraggableCircle />
      </div>
    </>
  );
}
