import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/sign-in"],
      disallow: [
        "/dashboard",
        "/documents",
        "/clients",
        "/fournisseurs",
        "/catalog",
        "/settings",
      ],
    },
  };
}
