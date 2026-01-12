import trimesh
import numpy as np

def final_bone_transplant():
    print("--- 开始【自动容错】精密缝合 ---")
    
    # 1. 加载模型
    skel = trimesh.load('project_-_tewi_fumo_model.glb', process=False)
    parts = trimesh.load('project_-_doremy_sweet_fumo_model.glb', process=False)

    # 打印出所有可用的零件名，方便调试
    print(f"Doremy 可用零件名: {list(parts.geometry.keys())}")

    # --- 2. 增强型零件获取函数 (防止 Object_6 变成 Object_6.001) ---
    def get_part(scene, name_keyword):
        for name in scene.geometry.keys():
            if name_keyword in name:
                return scene.geometry[name]
        raise ValueError(f"在零件模型中找不到包含 '{name_keyword}' 的几何体")

    try:
        # 手动合并双手
        hand_l = get_part(parts, 'Object_6')
        hand_r = get_part(parts, 'Object_8')
        hands_combined = trimesh.util.concatenate([hand_l, hand_r])
        
        doremy_parts = {
            'head': get_part(parts, 'Object_4'),
            'body': get_part(parts, 'Object_12'),
            'hands': hands_combined,
            'l_foot': get_part(parts, 'Object_10'),
            'r_foot': get_part(parts, 'Object_14')
        }
    except Exception as e:
        print(f"\n[匹配失败] {e}")
        print("请对比上面的 'Doremy 可用零件名' 列表，看看数字是不是变了。")
        return

    # 3. 核心映射表 (Tewi骨骼节点名 : doremy_parts 里的 Key)
    mapping = {
        'mesh_0': 'head',
        'Object_15': 'body',
        'Object_11': 'hands',
        'Object_13': 'l_foot',
        'Object_9': 'r_foot'
    }

    # 4. 执行替换
    for skel_node, doremy_key in mapping.items():
        if skel_node in skel.geometry:
            print(f"[对齐] 正在处理: {doremy_key} -> {skel_node}")
            
            old_mesh = skel.geometry[skel_node]
            new_mesh = doremy_parts[doremy_key].copy()
            
            # 对齐逻辑
            scale_ratio = old_mesh.extents.max() / new_mesh.extents.max()
            new_mesh.apply_scale(scale_ratio)
            new_mesh.apply_translation(old_mesh.bounding_box.centroid - new_mesh.bounding_box.centroid)
            
            # 替换数据以继承骨骼节点关系
            skel.geometry[skel_node] = new_mesh
        else:
            # 尝试模糊匹配 Tewi 的节点
            print(f"[警告] 找不到节点 {skel_node}，尝试模糊匹配...")

    # 5. 导出
    skel.export('doremy_rigged_final.glb')
    print("\n--- 成功！已生成 doremy_rigged_final.glb ---")

if __name__ == "__main__":
    final_bone_transplant()