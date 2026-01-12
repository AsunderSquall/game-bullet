import trimesh
import numpy as np

def fuse_skeleton_and_parts(skeleton_path, parts_path, output_path):
    print("--- 开始【基于空间对齐】的骨骼缝合手术 ---")
    
    # 1. 加载两个场景
    skeleton = trimesh.load(skeleton_path, process=False)
    parts = trimesh.load(parts_path, process=False)

    # --- 2. 沿用你验证过的对齐逻辑 (使用右臂作为基准) ---
    bone_ref_name = 'Bone.040.R_16'     # 骨骼参考点
    part_ref_node = 'Rarm_Base.003_1'   # 零件参考点
    
    if bone_ref_name not in skeleton.graph.nodes:
        print(f"错误: 骨架中找不到节点 {bone_ref_name}")
        return

    # 获取世界变换矩阵
    bone_matrix = skeleton.graph.get(bone_ref_name)[0]
    bone_world_pos = trimesh.transformations.translation_from_matrix(bone_matrix)

    # 零件模型如果没找到对应名，我们尝试通过关键词找一下
    actual_part_ref = None
    for node in parts.graph.nodes:
        if part_ref_node.lower() in node.lower():
            actual_part_ref = node
            break
    
    if not actual_part_ref:
        print(f"警告: 零件模型中找不到精确的 {part_ref_node}，将尝试 Object_2")
        actual_part_ref = 'Object_2' # 备选方案

    part_matrix = parts.graph.get(actual_part_ref)[0]
    part_world_pos = trimesh.transformations.translation_from_matrix(part_matrix)

    # 计算缩放比 (沿用你的 extents 逻辑)
    def get_max_extent(scene, keyword):
        for name, geom in scene.geometry.items():
            if keyword.lower() in name.lower():
                return geom.extents.max()
        return None

    size_skel = get_max_extent(skeleton, 'Rarm_Base')
    size_parts = get_max_extent(parts, 'Object') # Doremy 里的零件名通常是 Object_N
    scale_factor = size_skel / size_parts if (size_skel and size_parts) else 1.0
    print(f"应用对齐缩放: {scale_factor:.4f}")

    # --- 3. 准备 Doremy 的零件库 ---
    # 根据你之前的诊断，Doremy 的 0-5 对应部位
    # 需要对这些零件先应用【全局变换】使其在空间上与 Tewi 重合
    S = trimesh.transformations.scale_matrix(scale_factor)
    offset = bone_world_pos - (part_world_pos * scale_factor)
    T = trimesh.transformations.translation_matrix(offset)
    full_transform = trimesh.transformations.concatenate_matrices(T, S)
    
    # 把零件模型整体搬移到骨架的位置
    parts.apply_transform(full_transform)

    # 准备合并后的零件字典
    doremy_geoms = {
        'head':   parts.geometry['Object_0'],
        'hands':  trimesh.util.concatenate([parts.geometry['Object_1'], parts.geometry['Object_2']]),
        'l_foot': parts.geometry['Object_3'],
        'body':   parts.geometry['Object_4'],
        'r_foot': parts.geometry['Object_5']
    }

    # --- 4. 替换骨架模型中的“肉” (继承骨骼关系) ---
    # 根据你 Blender 查看的结果：
    # 头:mesh_0, 右脚:Object_9, 手:Object_11, 左脚:Object_13, 身体:Object_15
    mapping = {
        'mesh_0':    'head',
        'Object_2': 'hands',
        'Object_3': 'l_foot',
        'Object_4': 'body',
        'Object_1':  'r_foot'
    }

    replaced_count = 0
    # 我们遍历映射，直接修改 skeleton.geometry
    for skel_node, doremy_key in mapping.items():
        # 这里需要注意：skeleton.geometry 的 key 可能是 Object_15 或 mesh_0
        if skel_node in skeleton.geometry:
            print(f"[缝合] 正在将 {doremy_key} 挂载到骨架节点 {skel_node}")
            # 直接替换仓库里的 Mesh
            skeleton.geometry[skel_node] = doremy_geoms[doremy_key]
            replaced_count += 1
        else:
            # 模糊匹配 Tewi 的节点名，防止编号微调
            found = False
            for real_name in skeleton.geometry.keys():
                if skel_node.split('_')[0].lower() in real_name.lower():
                    skeleton.geometry[real_name] = doremy_geoms[doremy_key]
                    print(f"[模糊匹配缝合] {doremy_key} -> {real_name}")
                    found = True
                    replaced_count += 1
                    break

    # --- 5. 导出 ---
    if replaced_count > 0:
        skeleton.export(output_path)
        print(f"--- 缝合完成！骨骼已按上，输出: {output_path} ---")
    else:
        print("--- 失败：未能匹配到任何骨骼挂载点 ---")

# 执行
fuse_skeleton_and_parts(
    'project_-_tewi_fumo_model.glb', 
    'project_-_doremy_sweet_fumo_model.glb', 
    'doremy_rigged_final.glb'
)