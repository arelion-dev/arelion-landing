import React from "react"

const PostTags = ({ tags }) => {
  if (!tags) return null
  return (
    <div className="post-tags">
      {tags.map(tag => (
        <span key={tag} className="tag">
          {tag}
        </span>
      ))}
    </div>
  )
}

export default PostTags
