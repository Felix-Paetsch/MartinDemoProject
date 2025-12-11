let local_env = false;

export const is_local_environment = () => local_env;
export const set_local_environment = (r: boolean = true) => local_env = r;
