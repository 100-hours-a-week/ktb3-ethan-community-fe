import { index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.jsx"),
  route("join", "routes/join.jsx"),
  route("posts/new", "routes/posts.new.jsx"),
  route("posts/:postId", "routes/posts.$postId.jsx"),
  route("posts/:postId/edit", "routes/posts.$postId.edit.jsx"),
  route("profile", "routes/profile.jsx"),
];
