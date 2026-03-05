/**
 * @author Sprinix Team
 * @copyright Copyright (c) 2023 Sprinix Technolabs (https://www.sprinix.com).
 */

import { useEffect, useLayoutEffect } from "react";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ?   useLayoutEffect : useEffect;

export default useIsomorphicLayoutEffect;
