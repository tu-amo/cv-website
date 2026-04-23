#!/usr/bin/env python3
import os, shutil, pathlib

src = pathlib.Path.home() / ".gemini/antigravity/brain/415fe262-a385-4ed1-a892-6c6d9af4bfbd"
dst = pathlib.Path(__file__).parent / "public/images/blog"
dst.mkdir(parents=True, exist_ok=True)

files = {
    "post_unified_knowledge_systems_1776883535122.png": "post-unified-knowledge.png",
    "post_knowledge_sharing_workplace_1776883548491.png": "post-knowledge-sharing.png",
    "post_concern_to_measure_1776883563803.png": "post-concern-to-measure.png",
    "post_knowledge_sharing_presentation_1776883580959.png": "post-knowledge-globe.png",
    "post_complaints_architectural_data_1776883595036.png": "post-complaints.png",
    "post_retail_architecture_transformation_1776883605191.png": "post-retail-transformation.png",
}

for src_name, dst_name in files.items():
    src_path = src / src_name
    dst_path = dst / dst_name
    if src_path.exists():
        shutil.copy2(src_path, dst_path)
        print(f"✓ {dst_name}")
    else:
        print(f"✗ MISSING: {src_name}")
