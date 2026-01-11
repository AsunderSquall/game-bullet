import trimesh
import numpy as np
import os

def rotate_single_glb():
    # 1. 获取输入文件名
    file_path = input("请输入 .glb 文件路径 (例如 model.glb): ").strip()
    
    # 检查文件是否存在
    if not os.path.exists(file_path):
        print(f"错误: 找不到文件 '{file_path}'")
        return

    # 2. 选择旋转角度
    try:
        angle_degrees = float(input("请输入旋转角度 (例如 90 或 180): "))
    except ValueError:
        print("错误: 请输入数字角度")
        return

    # 3. 加载并旋转
    try:
        scene = trimesh.load(file_path)
        
        # 定义旋转矩阵：绕 Y 轴（竖直向上）旋转
        # 如果你的模型是 Z 轴向上，请把 [0, 1, 0] 改为 [0, 0, 1]
        angle_radians = np.radians(angle_degrees)
        rotation_matrix = trimesh.transformations.rotation_matrix(
            angle_radians, [0, 1, 0]
        )
        
        scene.apply_transform(rotation_matrix)
        
        # 4. 生成新文件名并导出
        name, ext = os.path.splitext(file_path)
        output_path = f"{name}_rotated_{int(angle_degrees)}{ext}"
        
        scene.export(output_path)
        print("-" * 30)
        print(f"✅ 处理成功！")
        print(f"保存位置: {output_path}")
        
    except Exception as e:
        print(f"发生错误: {e}")

if __name__ == "__main__":
    rotate_single_glb()
    