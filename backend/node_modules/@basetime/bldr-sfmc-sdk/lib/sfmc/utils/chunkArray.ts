const chunk = (arr: any[], size: number) => {
    return [...Array(Math.ceil(arr.length / size))].map((_, i) =>
        arr.slice(size * i, size + size * i)
    );
};

export { chunk };
