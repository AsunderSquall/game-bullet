import os
from pygltflib import GLTF2


def get_bone_names_from_glb(glb_path: str):
    """
    返回一个 glb 文件中所有骨骼的名字列表
    （基于 skin.joints 指向的 node）
    """
    gltf = GLTF2().load(glb_path)

    bone_names = []

    if not gltf.skins:
        return bone_names

    # 一般一个模型只有一个 skin，取第一个即可
    skin = gltf.skins[0]

    for joint_index in skin.joints:
        node = gltf.nodes[joint_index]
        name = node.name if node.name else f"joint_{joint_index}"
        bone_names.append(name)

    return bone_names


def scan_glb_folder(folder_path: str):
    for file in sorted(os.listdir(folder_path)):
        if not file.lower().endswith(".glb"):
            continue

        full_path = os.path.join(folder_path, file)

        try:
            bones = get_bone_names_from_glb(full_path)

            print("=" * 60)
            print(f"File: {file}")

            if not bones:
                print("  (No skin / no bones found)")
            else:
                for i, name in enumerate(bones):
                    print(f"  [{i:02d}] {name}")

        except Exception as e:
            print("=" * 60)
            print(f"File: {file}")
            print(f"  ERROR: {e}")


if __name__ == "__main__":
    folder = "models"
    scan_glb_folder(folder)
