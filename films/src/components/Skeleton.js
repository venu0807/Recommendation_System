import React from 'react';

export const SkeletonElement = ({ type }) => {
  const classes = `skeleton ${type}`;
  return <div className={classes}></div>;
};

export const SkeletonMovieCard = () => (
  <div className="skeleton-movie-card">
    <SkeletonElement type="image" />
    <div className="p-2">
      <SkeletonElement type="title" />
      <SkeletonElement type="text" />
    </div>
  </div>
);

export const SkeletonPersonCard = () => (
  <div className="skeleton-person-card">
    <SkeletonElement type="circle" />
    <div className="p-2">
      <SkeletonElement type="title" />
      <SkeletonElement type="text" />
    </div>
  </div>
);

export const SkeletonMovieDetail = () => (
  <div className="skeleton-movie-detail">
    <div className="row">
      <div className="col-md-4">
        <SkeletonElement type="poster" />
      </div>
      <div className="col-md-8">
        <SkeletonElement type="title" />
        <SkeletonElement type="text" />
        <SkeletonElement type="text" />
        <SkeletonElement type="text" />
      </div>
    </div>
  </div>
);

export const SkeletonSearchResult = () => (
  <div className="skeleton-search-result">
    <div className="d-flex">
      <SkeletonElement type="thumbnail" />
      <div className="flex-grow-1 p-2">
        <SkeletonElement type="title" />
        <SkeletonElement type="text" />
      </div>
    </div>
  </div>
);

export const SkeletonProfile = () => (
  <div className="skeleton-profile">
    <div className="row">
      <div className="col-md-3">
        <SkeletonElement type="circle" />
      </div>
      <div className="col-md-9">
        <SkeletonElement type="title" />
        <SkeletonElement type="text" />
        <SkeletonElement type="text" />
      </div>
    </div>
    <div className="mt-4">
      <SkeletonElement type="title" />
      <div className="row mt-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="col-md-3">
            <SkeletonMovieCard />
          </div>
        ))}
      </div>
    </div>
  </div>
);