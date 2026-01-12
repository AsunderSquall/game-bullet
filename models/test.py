import trimesh

# 加载模型
scene = trimesh.load('fixed_parts.glb')

# 打印所有节点名称
print("--- 模型所有节点列表 ---")
for name in scene.graph.nodes:
    print(name)