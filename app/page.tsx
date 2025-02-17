"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
// glTF形式の場合。OBJ等の場合は該当Loaderを使う
import { GLTFLoader } from "three-stdlib";

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // モーダルの表示状態
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // シーンとカメラ、レンダラーを準備
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0a0a0);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    // カメラの初期位置。後ほど毎フレーム更新するので初期化だけ
    camera.position.set(0, 2, 5);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current!,
      antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // ライトを配置
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 10, 10);
    scene.add(dirLight);

    // --------------------------------------
    // 1. Blenderから書き出したモデルを読み込み (床＆円柱群)
    // --------------------------------------
    const loader = new GLTFLoader();
    // models/myCircularStage.gltf のパスは適宜差し替えてください
    loader.load("/models/dummy_model.glb", (gltf) => {
      scene.add(gltf.scene);

      // 円柱（Columnという名前を想定）に対してボックスコライダを作成
      gltf.scene.traverse((child) => {
        if (child.name.includes("Column") && child instanceof THREE.Mesh) {
          const colBox = new THREE.Box3().setFromObject(child);
          columnColliders.push({ mesh: child, box: colBox });
        }
      });
    });

    // --------------------------------------
    // 2. プレイヤー（立方体）を配置
    // --------------------------------------
    const playerSize = 0.5;
    const playerGeometry = new THREE.BoxGeometry(
      playerSize,
      playerSize,
      playerSize
    );
    const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff88 });
    const player = new THREE.Mesh(playerGeometry, playerMaterial);
    // 床(y=0)上に置く
    player.position.set(0, playerSize / 2, 0);
    scene.add(player);

    // プレイヤー移動用のフラグ＆速度
    let moveForward = false;
    let moveBackward = false;
    let rotateLeft = false;
    let rotateRight = false;
    const moveSpeed = 0.05;
    const rotateSpeed = 0.03; // 左右回転の角速度(お好みで調整)

    // --------------------------------------
    // 3. 円柱との衝突判定 (Box3を使う簡易実装)
    // --------------------------------------
    const playerBox = new THREE.Box3();
    const columnColliders: { mesh: THREE.Object3D; box: THREE.Box3 }[] = [];

    // --------------------------------------
    // 4. キーボード入力(WASD)
    // --------------------------------------
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

    // --------------------------------------
    // カメラ追従用のオフセットを定義
    // （立方体の少し上＆後ろから見る）
    // --------------------------------------
    const cameraOffset = new THREE.Vector3(0, 2, 5);

    const animate = () => {
      requestAnimationFrame(animate);

      // ********** ここを修正 **********
      // 左右移動 (player.position.x +=) を削除し、
      // A,Dキー時はプレイヤーのY回転に反映
      // また、W,S前後移動は「プレイヤーが向いている方向」に合わせる

      // 1) 左右回転
      if (rotateLeft) {
        player.rotation.y += rotateSpeed;
      }
      if (rotateRight) {
        player.rotation.y -= rotateSpeed;
      }

      // 2) 前後移動
      //    立方体のローカルZ軸（Zマイナスが前）に沿って移動する
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

      // --- 以下、床の高さ制限や衝突判定、カメラ追従などはそのまま ---
      // 「床より下にいかないようにする」
      if (player.position.y < playerSize / 2) {
        player.position.y = playerSize / 2;
      }

      // 円柱との衝突判定（Box3）
      playerBox.setFromObject(player);
      for (const col of columnColliders) {
        col.box.setFromObject(col.mesh);
        if (playerBox.intersectsBox(col.box)) {
          setShowModal(true);
          break;
        }
      }

      // 1. cameraOffset(0,2,5)をプレイヤーのrotation.yに応じて回転させる
      const offsetRotated = cameraOffset.clone();
      offsetRotated.applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        player.rotation.y
      );

      // 2. プレイヤー位置 + 回転後オフセット でカメラ位置を設定
      camera.position.set(
        player.position.x + offsetRotated.x,
        player.position.y + offsetRotated.y,
        player.position.z + offsetRotated.z
      );

      // 3. カメラがプレイヤーを常に見る
      camera.lookAt(player.position);

      // 描画
      renderer.render(scene, camera);
    };
    animate();

    // コンポーネントアンマウント時のクリーンアップ
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      renderer.dispose();
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} style={{ display: "block" }} />
      {/* 衝突検知でモーダルを表示 */}
      {showModal && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "fadein 0.5s",
          }}
        >
          <div
            style={{ background: "#fff", padding: "2rem", borderRadius: "8px" }}
          >
            <h2>円柱と衝突しました！</h2>
            <button onClick={() => setShowModal(false)}>閉じる</button>
          </div>
        </div>
      )}

      {/* フェードイン用CSSアニメーション */}
      <style jsx global>{`
        @keyframes fadein {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
