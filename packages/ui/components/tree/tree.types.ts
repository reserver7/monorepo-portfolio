import * as React from "react";

export interface TreeNode {
  key: string;
  title: React.ReactNode;
  children?: readonly TreeNode[];
  disabled?: boolean;
  selectable?: boolean;
}
export interface TreeProps extends Omit<React.HTMLAttributes<HTMLUListElement>, "onSelect"> {
  treeData: readonly TreeNode[];
  selectedKeys?: readonly string[];
  defaultSelectedKeys?: readonly string[];
  expandedKeys?: readonly string[];
  defaultExpandedKeys?: readonly string[];
  onSelect?: (selectedKeys: string[], info: { node: TreeNode }) => void;
  onExpand?: (expandedKeys: string[]) => void;
  checkable?: boolean;
  checkedKeys?: readonly string[];
  defaultCheckedKeys?: readonly string[];
  onCheck?: (checkedKeys: string[], info: { node: TreeNode }) => void;
  multiple?: boolean;
}
